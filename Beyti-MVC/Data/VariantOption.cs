using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Beyti_MVC.Data;

[Table("VariantOption")]
public partial class VariantOption
{
    [Key]
    public int Id { get; set; }

    [StringLength(40)]
    public string Name { get; set; } = null!;

    [InverseProperty("VariantOption")]
    public virtual ICollection<VariantValue> VariantValues { get; set; } = new List<VariantValue>();
}
