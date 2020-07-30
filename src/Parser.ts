import Loader, { Force, Selection, Category, Cost } from './Loader';
import Roster from './Roster';
import Detachment from './Detachment';
import Unit from './Unit';
import Option from './Option';

class Parser {
  async parse(path: string): Promise<Roster> {
    const rosterFile = await new Loader(path).load();

    const roster = new Roster(rosterFile.roster.$.gameSystemName, rosterFile.roster.$.name);

    const {
      roster: { forces, costs, costLimits }
    } = rosterFile;

    forces.forEach(({ force }: { force: Force[] }) => {
      force.forEach((force: Force) => {
        const detachment = this.createDetachment(force);
        roster.addDetachment(detachment);
      });
    });

    costs.forEach(({ cost }: { cost: Cost[] }) => {
      cost.forEach((cost: Cost) => {
        roster.addBattleSize({ name: cost.$.name, value: +cost.$.value });
      });
    });

    costLimits.forEach(({ costLimit }: { costLimit: Cost[] }) => {
      costLimit.forEach((cost: Cost) => {
        roster.addMaxBattleSize({ name: cost.$.name, value: +cost.$.value });
      });
    });

    return roster;
  }

  private createDetachment(force: Force): Detachment {
    const { catalogueName: catalogue, name } = force.$;

    const detachment = new Detachment(name, catalogue);

    force.selections.forEach(({ selection }: { selection: Selection[] }) => {
      selection.forEach((selection: Selection) => {
        detachment.addUnit(this.createUnit(selection));
      });
    });

    return detachment;
  }

  private createUnit(selection: Selection): Unit {
    const { name, customName, customNote: note } = selection.$;

    const category = selection.categories
      ?.reduce((acc: Array<{ primary: boolean; name: string }>, { category }: { category: Category[] }) => {
        category.forEach(({ $: { primary, name } }: { $: { primary: string; name: string } }) => {
          acc.push({ primary: primary === 'true', name });
        });
        return acc;
      }, [])
      .find((category: { primary: boolean; name: string }) => !!category.primary);

    const unit = new Unit(name, category?.name, customName, note);

    selection.selections?.forEach(({ selection }: { selection: Selection[] }) => {
      selection.forEach((selection: Selection) => {
        unit.addOption(this.createOption(selection));
      });
    });

    return unit;
  }

  private createOption(selection: Selection): Option {
    const option = new Option(selection.$.name);

    selection.selections?.forEach(({ selection }: { selection?: Selection[] }) => {
      selection?.forEach((selection: Selection) => {
        option.addOption(this.createOption(selection));
      });
    });

    return option;
  }
}

export default new Parser();